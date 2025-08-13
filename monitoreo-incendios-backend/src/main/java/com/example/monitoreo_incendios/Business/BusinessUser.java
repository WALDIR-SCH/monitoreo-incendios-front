package com.example.monitoreo_incendios.Business;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.monitoreo_incendios.Helper.Validation;

import com.example.monitoreo_incendios.Dto.DtoRegisterUser;
import com.example.monitoreo_incendios.Dto.DtoUser;
import com.example.monitoreo_incendios.Entity.TRol;
import com.example.monitoreo_incendios.Entity.TRol.TipoRol;
import com.example.monitoreo_incendios.Entity.TUser;
import com.example.monitoreo_incendios.Helper.AesUtil;
import com.example.monitoreo_incendios.Helper.JwtUtil;
import com.example.monitoreo_incendios.Repository.RepoUser;
import com.example.monitoreo_incendios.Repository.RepoRol;

import jakarta.transaction.Transactional;

@Service
public class BusinessUser {
    @Value("${avatar.service.url}")
    private String avatarUrlService;

    @Autowired
    private RepoUser repoUser;

    @Autowired
    private RepoRol repoRol;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    @Transactional
    public void insert(DtoUser dtoUser) throws Exception {
        dtoUser.setIdUsuario(UUID.randomUUID().toString());
        dtoUser.setFechaRegistro(new Timestamp(System.currentTimeMillis()));

        TUser tUser = new TUser();
        tUser.setIdUsuario(dtoUser.getIdUsuario());
        tUser.setNombre(dtoUser.getNombre());
        tUser.setEmail(dtoUser.getEmail());
        tUser.setContrasenha(AesUtil.encrypt(dtoUser.getContrasenha()));
        tUser.setFechaRegistro(dtoUser.getFechaRegistro());

        repoUser.save(tUser);
    }

    public boolean emailExists(String email) {
        return repoUser.findByEmail(email).isPresent();
    }

    public boolean logout(String idUsuario) {
        return repoUser.findById(idUsuario).isPresent();
    }

    public DtoUser login(String email, String contrasenha) throws Exception {
        Optional<TUser> tUserOptional = repoUser.findByEmail(email);

        if (!tUserOptional.isPresent()) {
            return null;
        }

        TUser tUser = tUserOptional.get();
        if (!AesUtil.decrypt(tUser.getContrasenha()).equals(contrasenha)) {
            return null;
        }

        DtoUser dtoUser = new DtoUser();
        dtoUser.setIdUsuario(tUser.getIdUsuario());
        dtoUser.setNombre(tUser.getNombre());
        dtoUser.setEmail(tUser.getEmail());
        dtoUser.setFoto(tUser.getFoto());
        dtoUser.setFechaRegistro(tUser.getFechaRegistro());
        dtoUser.setContrasenha(tUser.getContrasenha());
        dtoUser.setIdRol(tUser.getRol().getIdRol());
        dtoUser.setNombreRol(tUser.getRol().getTipo().name());
        dtoUser.setJwtToken(new JwtUtil().generateToken(dtoUser.getIdUsuario(), dtoUser.getEmail()));
        return dtoUser;
    }

    public DtoUser loginConGoogle(String email) throws Exception {
        Optional<TUser> tUserOptional = repoUser.findByEmail(email);

        if (!tUserOptional.isPresent()) {
            return null;
        }

        TUser tUser = tUserOptional.get();

        // Verificar que sea un usuario de Google (sin contraseña)
        if (tUser.getContrasenha() != null) {
            throw new RuntimeException("Este email está registrado con contraseña. Use login tradicional.");
        }

        DtoUser dtoUser = new DtoUser();
        dtoUser.setIdUsuario(tUser.getIdUsuario());
        dtoUser.setNombre(tUser.getNombre());
        dtoUser.setEmail(tUser.getEmail());
        dtoUser.setFoto(tUser.getFoto());
        dtoUser.setFechaRegistro(tUser.getFechaRegistro());
        dtoUser.setContrasenha(null);
        dtoUser.setJwtToken(new JwtUtil().generateToken(dtoUser.getIdUsuario(), dtoUser.getEmail()));

        return dtoUser;
    }

    @Transactional
    public void registrarUsuarioConGoogle(DtoRegisterUser dto) throws Exception {

        TUser usuario = new TUser();
        usuario.setIdUsuario(UUID.randomUUID().toString());
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setContrasenha(null);
        String perfilUrl = subirFotoPerfil(dto, usuario);
        usuario.setFoto(perfilUrl);
        usuario.setFechaRegistro(new Timestamp(System.currentTimeMillis()));

        // Asignar rol de usuario por defecto
        TRol rol = repoRol.findByTipo(TipoRol.USUARIO)
                .orElseThrow(() -> new Exception("Rol 'usuario' no encontrado en la base de datos"));
        usuario.setRol(rol);

        repoUser.save(usuario);

        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setIdRol(usuario.getRol().getIdRol());
        dto.setFechaRegistro(usuario.getFechaRegistro());
    }

    //registro manual de usuario
    @Transactional
    public DtoRegisterUser registrarUsuario(DtoRegisterUser dto) throws Exception {
        // Verificar si el email ya existe
        if (emailExists(dto.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        TUser usuario = new TUser();
        usuario.setIdUsuario(UUID.randomUUID().toString());
        usuario.setNombre(Validation.capitalizeEachWord(dto.getNombre()));
        usuario.setEmail(dto.getEmail());

        TRol rolUsuario = repoRol.findByTipo(TRol.TipoRol.USUARIO)
                .orElseThrow(() -> new Exception("Rol INVITADO no configurado"));
        usuario.setRol(rolUsuario);

        String contrasenhaEncriptada = AesUtil.encrypt(dto.getContrasenha());
        usuario.setContrasenha(contrasenhaEncriptada);
        usuario.setFechaRegistro(new Timestamp(System.currentTimeMillis()));

        String perfilUrl = subirFotoPerfil(dto, usuario);
        usuario.setFoto(perfilUrl);

        repoUser.save(usuario);

        // Actualizar el DTO con los datos generados
        dto.setIdRol(usuario.getRol().getIdRol());
        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setAvatar(usuario.getFoto());
        dto.setFechaRegistro(usuario.getFechaRegistro());
        dto.setContrasenha(contrasenhaEncriptada);
        dto.setJwtToken(new JwtUtil().generateToken(dto.getIdUsuario(), dto.getEmail()));

        return dto;
    }

    private String subirFotoPerfil(DtoRegisterUser dto, TUser usuario) throws Exception {

        String perfilPath = "foto/" + usuario.getIdUsuario() + ".png";

        byte[] imagenBytes;

        if (dto.getAvatar() != null && !dto.getAvatar().isEmpty()) {
            imagenBytes = Validation.descargarImagen(dto.getAvatar());
            if (imagenBytes == null || imagenBytes.length == 0) {
                throw new RuntimeException("La imagen descargada desde Google está vacía.");
            }
        } else {
            // Generar una imagen predeterminada si no hay avatar
            String[] nombres = dto.getNombre().split(" ");
            String nombre = nombres.length > 0 ? nombres[0] : "";
            String avatarUrl = avatarUrlService + "?name="
                    + URLEncoder.encode(nombre, StandardCharsets.UTF_8) + "&background=random";

            System.out.println("Generando imagen predeterminada desde URL: " + avatarUrl);
            imagenBytes = Validation.descargarImagen(avatarUrl);
            if (imagenBytes == null || imagenBytes.length == 0) {
                throw new RuntimeException("No se pudo generar la imagen predeterminada.");
            }
        }

        return supabaseStorageService.uploadFileUrl(imagenBytes, perfilPath, "image/png");
    }

    public DtoUser getUserById(String idUsuario) {
        Optional<TUser> tUser = repoUser.findById(idUsuario);

        if (!tUser.isPresent()) {
            return null;
        }

        TUser user = tUser.get();
        DtoUser dtoUser = new DtoUser();
        dtoUser.setIdUsuario(user.getIdUsuario());
        dtoUser.setNombre(user.getNombre());
        dtoUser.setEmail(user.getEmail());
        dtoUser.setFoto(user.getFoto());
        dtoUser.setIdRol(user.getRol().getIdRol());
        dtoUser.setNombreRol(user.getRol().getTipo().name());
        dtoUser.setContrasenha(user.getContrasenha());
        dtoUser.setFechaRegistro(user.getFechaRegistro());

        return dtoUser;
    }

    public List<DtoUser> getAll() {
        List<TUser> listTUser = repoUser.findAll();
        List<DtoUser> listDtoUser = new ArrayList<>();

        for (TUser item : listTUser) {
            DtoUser dtoUser = new DtoUser();
            dtoUser.setIdUsuario(item.getIdUsuario());
            dtoUser.setNombre(item.getNombre());
            dtoUser.setEmail(item.getEmail());
            dtoUser.setFoto(item.getFoto());
            dtoUser.setContrasenha(item.getContrasenha());
            dtoUser.setFechaRegistro(item.getFechaRegistro());

            listDtoUser.add(dtoUser);
        }

        return listDtoUser;
    }

    @Transactional
    public boolean delete(String idUsuario) {
        Optional<TUser> tUser = repoUser.findById(idUsuario);

        if (tUser.isPresent()) {
            repoUser.deleteById(idUsuario);
            return true;
        }

        return false;
    }
}

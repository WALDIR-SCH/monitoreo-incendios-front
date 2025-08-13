package com.example.monitoreo_incendios.Controller.Google;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.google.api.client.json.jackson2.JacksonFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.example.monitoreo_incendios.Business.BusinessUser;
import com.example.monitoreo_incendios.Controller.Generic.ResponseGeneric;
import com.example.monitoreo_incendios.Dto.DtoRegisterUser;
import com.example.monitoreo_incendios.Entity.TUser;
import com.example.monitoreo_incendios.Helper.JwtUtil;
import com.example.monitoreo_incendios.Repository.RepoUser;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;


@RestController
@RequestMapping("/oauth2")
@CrossOrigin
public class GoogleAuthController {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Autowired
    private RepoUser repoUser;

    @Autowired
    private BusinessUser businessUser;

    @PostMapping("/callback/google")
    public ResponseEntity<ResponseGeneric<DtoRegisterUser>> googleAuth(@RequestBody GoogleTokenRequest tokenRequest) {
        ResponseGeneric<DtoRegisterUser> response = new ResponseGeneric<>();
        try {
            String idTokenString = tokenRequest.getIdTokenString();
            String accessToken = tokenRequest.getAccessToken();

            // Verificar el token de Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                response.setType("error");
                response.setListMessage(List.of("Token de Google no válido."));
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            // Obtener datos del usuario desde el token
            String email = payload.getEmail();
            String nombre = (String) payload.get("given_name");
            String apellidos = (String) payload.get("family_name");
            String avatar = (String) payload.get("picture");

            // Si el token no contiene los datos del perfil, obtenerlos desde la API de
            // Google
            if (accessToken != null && !accessToken.isEmpty()) {
                Map<String, Object> perfil = obtenerDatosPerfilDesdeGoogle(accessToken);
                if (nombre == null)
                    nombre = (String) perfil.get("given_name");
                if (apellidos == null)
                    apellidos = (String) perfil.get("family_name");
                if (avatar == null)
                    avatar = (String) perfil.get("picture");
            }

             // Verificar si el usuario ya existe
            Optional<TUser> existingUser = repoUser.findByEmail(email);
            if (existingUser.isPresent()) {
                // Generar un token JWT para el usuario existente
                TUser user = existingUser.get();
                String jwtToken = new JwtUtil().generateToken(user.getIdUsuario(), user.getEmail());

                response.setType("success");
                response.setListMessage(List.of("Inicio de sesión exitoso."));
                response.setData(new DtoRegisterUser(email, nombre, avatar, jwtToken));
                return new ResponseEntity<>(response, HttpStatus.OK);
            }

            // Registrar nuevo usuario con Google
            DtoRegisterUser dto = new DtoRegisterUser();
            dto.setEmail(email);
            dto.setNombre(nombre+" "+apellidos);
            dto.setAvatar(avatar);

            businessUser.registrarUsuarioConGoogle(dto);

            // Generar un token JWT para el nuevo usuario
            String jwtToken = new JwtUtil().generateToken(dto.getIdUsuario(), dto.getEmail());
            dto.setJwtToken(jwtToken);

            response.setType("success");
            response.setListMessage(List.of("Registro y inicio de sesión exitoso."));
            response.setData(dto);
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            response.setType("error");
            response.setListMessage(List.of("Token de Google no válido o mal formado."));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            e.printStackTrace();
            response.setType("error");
            response.setListMessage(List.of("Error: " + e.getMessage()));
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            response.setType("exception");
            response.setListMessage(List.of("Error al procesar la autenticación con Google."));
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, Object> obtenerDatosPerfilDesdeGoogle(String accessToken) throws IOException {
        String url = "https://www.googleapis.com/oauth2/v2/userinfo";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("La solicitud fue interrumpida", e);
        }

        if (response.statusCode() != 200) {
            throw new RuntimeException("Error al obtener los datos del perfil: " + response.body());
        }

        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
        });
    }
}

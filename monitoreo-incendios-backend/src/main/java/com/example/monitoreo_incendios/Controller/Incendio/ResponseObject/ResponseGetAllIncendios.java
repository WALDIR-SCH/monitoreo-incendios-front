package com.example.monitoreo_incendios.Controller.Incendio.ResponseObject;

import java.util.List;

import com.example.monitoreo_incendios.Controller.Generic.ResponseGeneric;
import com.example.monitoreo_incendios.Dto.DtoReporteIncendio;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseGetAllIncendios extends ResponseGeneric<List<DtoReporteIncendio>> {
    // Esta clase hereda de ResponseGeneric y puede tener campos adicionales si es necesario
}

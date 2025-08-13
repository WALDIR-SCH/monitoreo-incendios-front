
package com.example.monitoreo_incendios.Helper;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;


public class Validation {

    public static String normalizarNombreArchivo(String nombreArchivo) {
        return nombreArchivo.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public static byte[] descargarImagen(String url) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .build();

        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

        try (InputStream in = response.body()) {
            return in.readAllBytes();
        }
    }

    /*Empezar la solo la primera palabra en mayuscula */
    public static String capitalizeFirstLetter(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    /*Empezar cada palabra en mayuscula */
    public static String capitalizeEachWord(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String[] words = text.split("\\s+");
        StringBuilder capitalizedText = new StringBuilder();

        for (String word : words) {
            if (!word.isEmpty()) {
                capitalizedText.append(capitalizeFirstLetter(word)).append(" ");
            }
        }

        return capitalizedText.toString().trim();
    }

}

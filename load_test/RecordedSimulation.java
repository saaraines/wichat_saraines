package io.gatling.demo;

import java.time.Duration;
import java.util.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import io.gatling.javaapi.jdbc.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;
import static io.gatling.javaapi.jdbc.JdbcDsl.*;

public class RecordedSimulation extends Simulation {

  private HttpProtocolBuilder httpProtocol = http
    .baseUrl("http://192.168.0.200:3000")
    .inferHtmlResources()
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.9")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36");
  
  private Map<CharSequence, String> headers_0 = Map.ofEntries(
    Map.entry("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"),
    Map.entry("Proxy-Connection", "keep-alive"),
    Map.entry("Upgrade-Insecure-Requests", "1")
  );
  
  private Map<CharSequence, String> headers_2 = Map.ofEntries(
    Map.entry("Accept", "*/*"),
    Map.entry("Proxy-Connection", "keep-alive")
  );
  
  private Map<CharSequence, String> headers_3 = Map.of("Proxy-Connection", "keep-alive");


  private ScenarioBuilder scn = scenario("RecordedSimulation")
    .exec(
      http("request_0")
        .get("/")
        .headers(headers_0),
      pause(22),
      http("request_1")
        .get("/game")
        .headers(headers_0),
      pause(26),
      http("request_2")
        .get("/manifest.json")
        .headers(headers_2)
        .resources(
          http("request_3")
            .get("/static/js/bundle.js.map")
            .headers(headers_3)
        )
    );

  {
	  setUp(scn.injectOpen(atOnceUsers(20))).protocols(httpProtocol);
  }
}

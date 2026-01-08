Feature: Panel de administración completo
  Como administrador del sistema
  Quiero gestionar usuarios, ver estadísticas y administrar preguntas

  Scenario: Login como administrador y acceder al dashboard
    Given estoy en la página de bienvenida
    When ingreso usuario "admin" y contraseña "hola"
    And hago clic en login
    Then debería estar en la página de admin
    And debería ver las 3 tarjetas del dashboard
    And debería ver la tarjeta de Usuarios
    And debería ver la tarjeta de Estadísticas
    And debería ver la tarjeta de Preguntas

  Scenario: Acceder a la gestión de usuarios
    Given he iniciado sesión como admin
    When hago clic en la tarjeta de Usuarios
    Then debería ver la página de gestión de usuarios
    And debería ver una tabla de usuarios
    And debería ver el botón de volver

  Scenario: Acceder a estadísticas globales
    Given he iniciado sesión como admin
    When hago clic en la tarjeta de Estadísticas
    Then debería ver la página de estadísticas
    And debería ver las estadísticas globales
    And debería ver el total de partidas
    And debería ver el total de jugadores

  Scenario: Filtrar estadísticas por usuario específico
    Given he iniciado sesión como admin
    And estoy en la página de estadísticas
    When selecciono el filtro de usuario
    And selecciono el usuario "chetis"
    Then debería ver las estadísticas filtradas

  Scenario: Acceder a gestión de preguntas
    Given he iniciado sesión como admin
    When hago clic en la tarjeta de Preguntas
    Then debería ver la página de gestión de preguntas
    And debería ver el panel de generación de preguntas
    And debería ver la lista de preguntas existentes

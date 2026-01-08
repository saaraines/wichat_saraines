Feature: Usuario bloqueado intenta acceder
  Como usuario bloqueado del sistema
  No debería poder acceder a la aplicación

  Scenario: Usuario bloqueado intenta hacer login
    Given estoy en la página de bienvenida
    When ingreso usuario "blocked" y contraseña "hola"
    And hago clic en el botón de login
    Then debería ver un mensaje de error de cuenta bloqueada
    And debería ser redirigido a la página de bloqueado

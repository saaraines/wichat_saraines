Feature: Verificar categorías de juego
  Como usuario normal
  Quiero que las preguntas correspondan a la categoría seleccionada
  Para jugar correctamente

  Scenario: Jugar en categoría Capitales
    Given he iniciado sesión como "chetis"
    When selecciono la categoría "Capitales"
    And inicio el juego
    Then debería ver una pregunta de categoría Capitales
    And debería poder ver la imagen de la pregunta
    And debería ver 4 opciones de respuesta

  Scenario: Jugar en categoría Banderas
    Given he iniciado sesión como "chetis"
    When selecciono la categoría "Banderas"
    And inicio el juego
    Then debería ver una pregunta de categoría Banderas
    And debería poder ver la imagen de la pregunta
    And debería ver 4 opciones de respuesta


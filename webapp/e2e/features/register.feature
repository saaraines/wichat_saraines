Feature: Register into the app

Scenario: Register with correct input
  Given I am on the welcome page
  And I click on the register tab
  When I enter username "newuser" and password "Test123456" and confirm password "Test123456"
  And I click the register button
  Then I should see a success message "Usuario registrado exitosamente"

Scenario: Register with weak password
  Given I am on the welcome page
  And I click on the register tab
  When I enter username "newuser2" and password "weak" and confirm password "weak"
  And I click the register button
  Then I should see an error message "La contraseña debe tener al menos 8 caracteres"

Scenario: Register with repeated username
  Given I am on the welcome page
  And I click on the register tab
  When I enter username "testuser" and password "Test123456" and confirm password "Test123456"
  And I click the register button
  Then I should see an error message "El nombre de usuario ya existe"

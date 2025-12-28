Feature: Login into the app

Scenario: Login with correct credentials
  Given I am on the welcome page
  When I enter username "testuser" and password "Test123456"
  And I click the login button
  Then I should be redirected to "/game"

Scenario: Login with incorrect credentials
  Given I am on the welcome page
  When I enter username "testuser" and password "wrongpass"
  And I click the login button
  Then I should see an error message "Usuario o contraseña incorrectos"

Feature: Blocked user cannot login

Scenario: Blocked user sees error and is redirected
  Given I am on the welcome page
  When I enter username "blocked" and password "hola"
  And I click the login button
  Then I should see an error message "Tu cuenta ha sido bloqueada"
  And I should be redirected to the blocked page

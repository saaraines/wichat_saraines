Feature: Play the game

  Scenario: Start a game and view first question
    Given I am logged in as "player1" with password "Pass123"
    When I select category "Capitales"
    And I click start game
    Then I should see the game screen
    And I should see a question

  Scenario: Use hint system
    Given I am logged in as "player2" with password "Pass123"
    And I have started a game
    When I click the hint button
    Then The hint chat should open

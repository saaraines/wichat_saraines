Feature: View statistics

Scenario: User views their own statistics
  Given I am logged in as "statsuser" with password "Pass123"
  When I navigate to my statistics page
  Then I should see my total games played
  And I should see my game history

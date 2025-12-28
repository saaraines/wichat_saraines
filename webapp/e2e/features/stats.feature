Feature: View statistics

Scenario: User views their own statistics
  Given I am logged in as "chetis" with password "hola"
  When I navigate to my statistics page
  Then I should see my total games played
  And I should see my game history

Scenario: Admin views user statistics
  Given I am logged in as admin "admin" with password "hola"
  When I navigate to admin statistics
  And I filter by user "chetis"
  Then I should see games for user "chetis"

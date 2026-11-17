# Spec Delta

## MODIFIED Requirements

### Requirement: Single layout control and two print actions

The card tool SHALL expose the layout as one three-state dropdown control whose closed label is the active layout, plus a Print action and a Debug Print action. The dropdown SHALL offer exactly Fronts, Backs, and Both, and SHALL mark the active one. The separate Print backs and Show backs controls SHALL remain removed.

#### Scenario: Control set

- **WHEN** at least one card is selected
- **THEN** the workspace bar shows the layout dropdown, Print, and Debug Print
- **AND** no Print backs or Show backs control is present

#### Scenario: Active layout is the closed label

- **WHEN** the layout is Both
- **THEN** the closed layout control shows Both

#### Scenario: All three layouts remain available

- **WHEN** the user opens the layout dropdown
- **THEN** Fronts, Backs, and Both are all offered
- **AND** exactly one is marked as active

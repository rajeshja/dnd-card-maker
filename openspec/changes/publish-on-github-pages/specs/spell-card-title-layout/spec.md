# Spec Delta

## Purpose

Defines how long spell names are displayed on card fronts when their text has no spaces but contains a slash that can serve as a natural line-break point.

## ADDED Requirements

### Requirement: Long slash-separated spell titles can wrap
The spell card front SHALL allow a long, unspaced title containing `/` to wrap immediately after the slash rather than clipping the name at the title boundary.

#### Scenario: Slash provides a title line break
- **WHEN** a spell front title contains a long unspaced segment with `/` that exceeds the available title width
- **THEN** the title can wrap after `/`
- **AND** the slash and the remaining title text remain visible

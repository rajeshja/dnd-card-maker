# Spec Delta

## Purpose

Provides a clear, themed starting point for the standalone card-printing tools so visitors can find the spell, item, and beast workflows from the site root.

## ADDED Requirements

### Requirement: Home page links to each card printer
The site root SHALL present a home page using the card printers' visual theme and provide a clear, usable link to each available card printer.

#### Scenario: Choose a card printer
- **WHEN** a visitor opens the site root
- **THEN** the page presents links to the spell, item, and beast card printers
- **AND** each link opens its corresponding printer page

#### Scenario: Use the home page on a narrow screen
- **WHEN** a visitor opens the home page on a narrow viewport
- **THEN** the links remain visible, readable, and usable without horizontal page scrolling

#!/usr/bin/bash
# Determines whether a version increment to a package is valid

is_valid_increment() {
  local current="$1"
  local next="$2"

  if [[ "$current" == "null" ]]; then
    if [[ "$next" == "1.0.0" ]]; then
      return 0  # valid initial version
    else
      return 1  # invalid first version
    fi
  fi

  IFS='.' read -r curr_major curr_minor curr_patch <<< "$current"
  IFS='.' read -r new_major new_minor new_patch <<< "$next"

  if (( new_major == curr_major && new_minor == curr_minor && new_patch == curr_patch + 1 )); then
    return 0  # valid patch bump
  elif (( new_major == curr_major && new_minor == curr_minor + 1 && new_patch == 0 )); then
    return 0  # valid minor bump
  elif (( new_major == curr_major + 1 && new_minor == 0 && new_patch == 0 )); then
    return 0  # valid major bump
  else
    return 1  # invalid or skipped
  fi
}

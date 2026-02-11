# Moved blocks to handle resource renames without destroy/recreate

moved {
  from = module.letter_status_updates_queue
  to   = module.amendments_queue
}

moved {
  from = module.letter_status_update
  to   = module.amendment_event_transformer
}

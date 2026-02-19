locals {
  lambda_alarm_targets = {
    authorizer_lambda          = module.authorizer_lambda.function_name
    get_letter                 = module.get_letter.function_name
    get_letters                = module.get_letters.function_name
    get_letter_data            = module.get_letter_data.function_name
    get_status                 = module.get_status.function_name
    patch_letter               = module.patch_letter.function_name
    post_letters               = module.post_letters.function_name
    post_mi                    = module.post_mi.function_name
    upsert_letter              = module.upsert_letter.function_name
    letter_status_update       = module.letter_status_update.function_name
    letter_updates_transformer = module.letter_updates_transformer.function_name
    mi_updates_transformer     = module.mi_updates_transformer.function_name
  }

  sqs_queue_names = {
    letter_updates = {
      name               = module.sqs_letter_updates.sqs_queue_name
      age_period_seconds = 900
    }
    letter_status_updates = {
      name               = module.letter_status_updates_queue.sqs_queue_name
      age_period_seconds = 900
    }
  }
}

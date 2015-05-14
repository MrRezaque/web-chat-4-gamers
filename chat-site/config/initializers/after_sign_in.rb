Warden::Manager.after_authentication do |user, auth, opts|

  Rails.logger.debug 'after_authentication triggered'

  user.auth_token = ApplicationHelper::get_token
  #User.update( user.id, auth_token: auth_token)
  Rails.logger.debug 'entity updated!'

end
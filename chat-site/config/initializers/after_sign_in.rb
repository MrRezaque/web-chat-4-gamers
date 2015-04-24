Warden::Manager.after_authentication do |user, auth, opts|

  Rails.logger.debug 'after_authentication triggered'
  auth_token = loop do
    token = SecureRandom.urlsafe_base64
    break token unless User.exists?(auth_token: token)
  end
  Rails.logger.debug "auth token is: " + auth_token
  user.auth_token = auth_token
  #User.update( user.id, auth_token: auth_token)
  Rails.logger.debug 'entity updated!'

end
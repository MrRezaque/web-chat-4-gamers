module ApplicationHelper
  def self.get_token
    auth_token = loop do
      token = SecureRandom.urlsafe_base64
      break token unless User.exists?(auth_token: token)
    end
    Rails.logger.debug "auth token is: " + auth_token
    auth_token
  end
end

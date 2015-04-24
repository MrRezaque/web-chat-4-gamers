class CustomSessionController < Devise::SessionsController

  # before_filter :before_login, :only => :create
  # #after_filter :after_login,  :only => :create
  # #after_filter :after_logout, :only => :destroy
  #
  # def before_login
  #   token = resource.username + '_' + SecureRandom.urlsafe_base64
  #   resource.update(auth_token: token)
  # end

  # def after_login
  #   user.auth_token = loop do
  #     token = SecureRandom.urlsafe_base64
  #     break token unless User.exists?(auth_token: token)
  #   end
  # end
end
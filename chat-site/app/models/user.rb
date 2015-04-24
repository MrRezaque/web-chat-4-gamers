class User < ActiveRecord::Base

  # Virtual attribute for authenticating by either username or email
  # This is in addition to a real persisted field like 'username'
  # attr_accessor :login	

  # def login=(login)
  #   @login = login
  # end

  # def login
  #   @login || self.username || self.email
  # end

  validates :username,
  	:presence => true,

  	:uniqueness => {
      :case_sensitive => false
    },
    :format => {
      with: /\A[^`!@#\$%\^&*+_=]+\z/
    },
    :length => {
        minimum: 3,
        maximum: 18
    }

  



  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable
         #,:authentication_keys => [:login]

end

class MainController < ApplicationController
  def root
    redirect_to chat_path
  end
end

class ChatController < ApplicationController

  def csgo
    rooms = %w(search trade talk)
    room = params['room']

    if room.blank?
      render :csgo_chat_type_select
    elsif room.in? rooms
      render 'chat', locals: { room: room, endpoint: "#{configatron.chat.csgo.endpoint}/#{room}" }
    else
      raise ActionController::RoutingError.new('Not Found')
    end
  end

  def dota2
    rooms = %w(search trade talk)
    room = params['room']

    if room.blank?
      render :dota2_chat_type_select
    elsif room.in? rooms
      render 'chat', locals: { room: room, endpoint: "#{configatron.chat.dota2.endpoint}/#{room}" }
    else
      raise ActionController::RoutingError.new('Not Found')
    end
  end



  def root
    render :game_select
  end

  # def game_controller
  #
  #   games = configatron.games.each.select { |g| g['path'] }
  #   game = params['game']
  #   if game.empty?
  #
  #   elsif  game.in? games
  #
  #   else
  #     raise ActionController::RoutingError.new('Not Found')
  #   end
  #
  #   params.each do |key,value|
  #     Rails.logger.warn "Param #{key}: #{value}"
  #   end
  #
  # end
  #
  # protected
  #
  # def render_chat_type_select(rooms)
  #   render :csgo_chat_type_select, rooms
  # end
  #
  # def render_chat
  #   render 'chat'
  # end
end

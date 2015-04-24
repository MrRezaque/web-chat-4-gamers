require 'test_helper'

class ChatControllerTest < ActionController::TestCase
  test "should get root" do
    get :root
    assert_response :success
  end

  test "should get csgo_chat" do
    get :csgo_chat
    assert_response :success
  end

  test "should get dota2" do
    get :dota2
    assert_response :success
  end

end

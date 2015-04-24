class AddChatBannedUntil < ActiveRecord::Migration
  def change
    add_column :users, 'chat_banned_until', :datetime
  end
end

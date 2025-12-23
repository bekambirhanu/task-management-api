class ListenEvents {
    static CONNECTION = 'connection';
    static DISCONNECT = 'disconnect';
    static UPDATE_ACTIVITY = 'update_activity';
    static GET_ONLINE_USERS = 'get_online_users';
    static CHECK_USER_STATUS = 'check_user_status';
    static USER_MESSAGE = 'user_message';
    static GET_NOTIFICATIONS = 'get_notifications';
    static MARK_AS_READ = 'mark_as_read';
    static JOIN_TASK = 'join_task';
    static LEAVE_TASK = 'leave_task';
    static CREATE_TASK = 'create_task';
    static UPDATE_TASK = 'update_task';
    static DELETE_TASK = 'delete_task';
}

module.exports = ListenEvents;
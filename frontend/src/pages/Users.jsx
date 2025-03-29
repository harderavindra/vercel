import React, { useState } from "react";
import UserForm from "../components/UserForm";
import UserList from "../components/UserList";

const Users = () => {
    const [userCreated, setUserCreated] = useState(false);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <UserForm onUserCreated={() => setUserCreated(!userCreated)} />
            <UserList key={userCreated} />
        </div>
    );
};

export default Users;

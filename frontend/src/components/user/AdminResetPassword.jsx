import React, { useContext } from 'react'
import InputText from '../common/InputText'
import { useState } from 'react'
import Button from '../common/Button'
import { resetPassword } from '../../api/userApi'
import StatusMessage from '../common/StatusMessage'

const AdminResetPassword = ({userId}) => { 
    
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error  , setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false);

   const handleReset = async () => {

    setMessage('');
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Both fields are required");
      return;
    }
    if (password.trim() !== confirmPassword.trim()) {
      console.log("Passwords do not match:", password, confirmPassword);
      setError("Passwords do not match");
      return;
  }
setLoading(true);

  
try {
  await resetPassword(userId, password.trim());
  setMessage("Password reset successfully!");
  setError('')
  setPassword("");
  setConfirmPassword("");
} catch (error) {
  console.error("Reset Password Error:", error);
  setError(error.response?.data?.message || "Error resetting password");
} finally {
  setLoading(false);
}
};

  return (
    <div className="flex flex-col items-center gap-3">
  {loading && (
                                    <div>
                                        <StatusMessage variant="progress">
                                          Loading...
                                        </StatusMessage>
                                    </div>
                                )}
                                {error && (
                                    <div>
                                        <StatusMessage variant="error">{error}
                                        </StatusMessage>
                                    </div>
                                )}
                                  {message && (
                                    <div>
                                        <StatusMessage variant="success">{message}</StatusMessage>
                                    </div>
                                )}
          <div className='min-w-3xs flex flex-col gap-3'>
            <InputText 
                type="password" 
                name="password" 
                label={'Password'}
                placeholder="Enter new password"
                value={password} 
                handleOnChange={(e) => setPassword(e.target.value)} 
            />
            
            <InputText 
                type="password" 
                name="confirmPassword" 
                label={'Confirm Password'}
                placeholder="Confirm new password"
                value={confirmPassword} 
                handleOnChange={(e) => setConfirmPassword(e.target.value)} 
            />

            <Button 
                onClick={handleReset} 
                disabled={loading || !password || !confirmPassword}
            >
              
                {loading ? "Resetting..." : "Reset"}
            </Button>


          
            </div>
        </div>
  )
}

export default AdminResetPassword
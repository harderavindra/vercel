import React from 'react'

const InputText = ({type='text', value, name, label, placeholder, handleOnChange}) => {
  return (
   <div className='flex flex-col gap-1 w-full'>
   {label && (<label>{label}</label>)}
      <input type={type} value={value}  name={name} onChange={handleOnChange}  className='border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0'  />
   </div>
  )
}

export default InputText
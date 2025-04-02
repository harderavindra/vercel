import React from 'react'

const PageTitle = ({className, children}) => {
  return (
    <h1 className={`${className || ''} text-3xl font-bold`}>{children}</h1>
  )
}

export default PageTitle
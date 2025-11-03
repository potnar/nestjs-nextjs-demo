'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'

export default function FormExample() {

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>{

    
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    })

}

  return (
    <form>
        <div className="space-y-2 mb-4 shadow-md p-4 rounded-md border">
            <label className="block text-sm font-medium text-gray-700 text-gray-300" htmlFor="name">Name</label>
            <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" type="text" name="name" value={formData.name} onChange={onChange} />
            {formData.name}
        </div>
        <div className="space-y-2 mb-4 shadow-md p-4 rounded-md border">
            <label className="block text-sm font-medium text-gray-700 text-gray-300" htmlFor="email">Email</label>
            <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" type="email" name="email" value={formData.email} onChange={onChange} />
            {formData.email}
        </div>
        <div className="space-y-2 mb-4 shadow-md p-4 rounded-md border">
            <label className="block text-sm font-medium text-gray-700 text-gray-300" htmlFor="password">Password</label>
            <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" type="password" name="password" value={formData.password} onChange={onChange} />
        </div>
        <Button  type="submit">Submit</Button>
    </form>
  )
}
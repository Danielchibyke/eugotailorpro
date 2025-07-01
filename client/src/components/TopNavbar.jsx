import React from 'react';
import './TopNavbar.css'; 

export default function TopNavbar(){
   
        return (
            <div className='topNavbar-container background'>
               <div className='logo-container'>
                    <img src='/public/logo-placeholder.png' alt='logo' />
                </div> 
                <div className='topNavbar-links'>
                    <ul>
                        <li>Notification</li>
                        <li>About</li>
                        <li>Contact</li>
                        <li>Profile</li>
                    </ul>

                    </div>
            </div>
        )
  
}

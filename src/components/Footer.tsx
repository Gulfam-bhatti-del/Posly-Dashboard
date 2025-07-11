import React from 'react'

function Footer() {
    return (
        <div className='justify-center'>
            {/* Footer */}
            <div className="p-9 rounded-lg block items-center justify-between m-auto bg-gray-200 text-sm text-gray-600 w-[98%]">
                <div>
                    <span className="font-bold text-gray-800">Posly - POS With Ultimate Inventory</span>
                </div>
                <br /><div className="h-px w-full mb-5 bg-gray-300" />
                <div className="flex items-center gap-2">
                    <div className="w-16 h-16">
                        <img src="https://posly.getstocky.com/images/logo-default.svg" alt="Posly Logo" className='w-full h-full' />
                    </div>
                    © 2025 Posly v1.2
                    <br />
                    All rights reserved
                </div>
            </div>
        </div>
    )
}

export default Footer
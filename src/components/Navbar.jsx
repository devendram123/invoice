import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
    return (
        <nav className="nav-bar">
            <div className="nav-logo" onClick={() => setActiveTab('create')} style={{ cursor: 'pointer' }}>
                Invoice Pro
            </div>
            <div className="nav-links">
                <a
                    href="#create"
                    className={activeTab === 'create' || activeTab === 'preview' ? 'active' : ''}
                    onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('create');
                    }}
                >
                    Create Invoice
                </a>
                <a
                    href="#history"
                    className={activeTab === 'history' ? 'active' : ''}
                    onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('history');
                    }}
                >
                    Invoice History
                </a>
            </div>
        </nav>
    );
}

import React, { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
    pondCount: number;
    setPondCount: (count: number) => void;
    pondOptions: string[];
};

const SettingsContext = createContext<SettingsContextType>({
    pondCount: 8,
    setPondCount: () => { },
    pondOptions: Array.from({ length: 8 }, (_, i) => `${i + 1}号塘`),
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [pondCount, setPondCountState] = useState<number>(() => {
        const stored = localStorage.getItem('app_pond_count');
        return stored ? parseInt(stored, 10) : 8;
    });

    const setPondCount = (count: number) => {
        setPondCountState(count);
        localStorage.setItem('app_pond_count', count.toString());
    };

    const pondOptions = Array.from({ length: pondCount }, (_, i) => `${i + 1}号塘`);

    return (
        <SettingsContext.Provider value={{ pondCount, setPondCount, pondOptions }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

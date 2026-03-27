export const parseDate = (date: any): Date | null => {
    if (!date) return null;
    let d = new Date(date);
    if (!isNaN(d.getTime())) return d;

    // Try replacing space with T for SQL timestamps (YYYY-MM-DD HH:MM:SS)
    if (typeof date === 'string') {
        const iso = date.replace(' ', 'T');
        d = new Date(iso);
        if (!isNaN(d.getTime())) return d;
    }

    // Try numeric timestamp (seconds vs ms)
    if (typeof date === 'number' || !isNaN(Number(date))) {
        const num = Number(date);
        // Heuristic: if small number (less than 10e10), likely seconds
        if (num < 10000000000) {
            d = new Date(num * 1000);
        } else {
            d = new Date(num);
        }
        if (!isNaN(d.getTime())) return d;
    }

    return null;
}

export const isValidDate = (date: any): boolean => {
    return !!parseDate(date);
};

export const formatDate = (date: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
    const d = parseDate(date);
    if (!d) {
        return "N/A";
    }
    return d.toLocaleDateString(undefined, options);
};

export const formatTime = (date: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
    const d = parseDate(date);
    if (!d) {
        return "N/A";
    }
    return d.toLocaleTimeString(undefined, options || { hour: '2-digit', minute: '2-digit' });
};

export const calculateAge = (dob: string | Date | undefined | null): string => {
    const birthDate = parseDate(dob);
    if (!birthDate) {
        return "N/A";
    }
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
};

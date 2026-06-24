let _subject = '';
export const setContactSubject = (s: string) => { _subject = s; };
export const consumeContactSubject = () => { const s = _subject; _subject = ''; return s; };

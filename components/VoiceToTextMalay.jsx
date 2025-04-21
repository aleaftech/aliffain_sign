'use client';

import { useEffect, useState, useRef } from 'react';

const VoiceToTextMalay = () => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [imageUrls, setImageUrls] = useState({});
    const recognitionRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedWord, setSelectedWord] = useState(null);
    const [micPermission, setMicPermission] = useState(null); // 'granted', 'denied', or null

    const wordImageMap = {
        'cara': '/images/signlanguage/malay/cara.jpg',
        'makan': '/images/signlanguage/malay/makan.jpg',
        'nasi': '/images/signlanguage/malay/nasi.jpg',
        'goreng': '/images/signlanguage/malay/goreng.jpg',
        'ayam': '/images/signlanguage/malay/ayam.jpg',
        // Add more words and their corresponding image URLs here
    };

    useEffect(() => {
        const checkMicPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicPermission('granted');
                stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            } catch (error) {
                console.error("Microphone permission denied:", error);
                setMicPermission('denied');
                setErrorMessage('Kebenaran mikrofon ditolak. Sila benarkan akses mikrofon untuk menggunakan ciri ini.');
            }
        };

        checkMicPermission(); // Check permission on mount

        // **Move SpeechRecognition initialization into useEffect**
        if (typeof window !== 'undefined') { // **Important check**
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'ms-MY';

                recognitionRef.current.onresult = (event) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        }
                    }

                    setTranscript((prevTranscript) => prevTranscript + finalTranscript);

                    const newImageUrls = {};
                    finalTranscript.split(' ').forEach(word => {
                        const cleanedWord = word.toLowerCase().replace(/[^a-z']/g, '');
                        if (wordImageMap[cleanedWord]) {
                            newImageUrls[cleanedWord] = wordImageMap[cleanedWord];
                        }
                    });
                    setImageUrls((prevImageUrls) => ({ ...prevImageUrls, ...newImageUrls }));
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    if (event.error === 'no-speech') {
                        setErrorMessage('Tiada pertuturan dikesan. Sila cuba bercakap lagi.');
                    } else if (event.error === 'audio-capture') {
                        setErrorMessage('Ralat menangkap audio. Pastikan mikrofon anda berfungsi dan kebenaran diberikan.');
                    } else if (event.error === 'not-allowed') {
                        setErrorMessage('Aplikasi ini tidak dibenarkan menggunakan mikrofon anda. Sila semak tetapan penyemak imbas anda.');
                    } else {
                        setErrorMessage('Ralat pengecaman suara: ' + event.error);
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            } else {
                setErrorMessage('Pengecaman suara tidak disokong oleh penyemak imbas ini.');
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
            }
        };
    }, []); // <-- Empty dependency array, runs only once on mount

    const startListeningHandler = async () => {
        if (micPermission !== 'granted') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicPermission('granted');
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error("Microphone permission denied:", error);
                setMicPermission('denied');
                setErrorMessage('Kebenaran mikrofon ditolak. Sila benarkan akses mikrofon untuk menggunakan ciri ini.');
                return; // Don't start listening if permission is denied
            }
        }

        setErrorMessage('');
        setTranscript('');
        setImageUrls({});
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                setIsListening(false);
                setErrorMessage('Gagal memulakan pengecaman suara.');
            }
        }
    };

    const stopListeningHandler = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const clearTranscriptHandler = () => {
        setTranscript('');
        setImageUrls({});
    };

    const openImagePopup = (url, word) => {
        setSelectedImage(url);
        setSelectedWord(word);
    };

    const closeImagePopup = () => {
        setSelectedImage(null);
        setSelectedWord(null);
    };

    const getWordList = () => {
        return Object.keys(imageUrls);
    };

    const getCurrentImageIndex = () => {
        const words = getWordList();
        if (selectedImage) {
            return words.findIndex(word => imageUrls[word] === selectedImage);
        }
        return -1;
    };

    const goToPreviousImage = () => {
        const currentIndex = getCurrentImageIndex();
        if (currentIndex > 0) {
            const words = getWordList();
            setSelectedImage(imageUrls[words[currentIndex - 1]]);
            setSelectedWord(words[currentIndex - 1]);
        }
    };

    const goToNextImage = () => {
        const currentIndex = getCurrentImageIndex();
        const words = getWordList();
        if (currentIndex < words.length - 1) {
            setSelectedImage(imageUrls[words[currentIndex + 1]]);
            setSelectedWord(words[currentIndex + 1]);
        }
    };

    return (
        <div className="voice-to-text-container">
            <h2>Malay Voice to Text</h2>

            {micPermission === 'denied' && (
                <p className="permission-warning">
                    Sila benarkan akses mikrofon untuk menggunakan ciri ini.
                </p>
            )}

            <div className="controls">
                <button
                    className={`listen-button ${isListening ? 'listening' : ''}`}
                    onClick={startListeningHandler}
                    disabled={isListening || micPermission === 'denied'} // Simplified condition
                >
                    {isListening ? 'Mendengar...' : 'Mula Mendengar'}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="microphone-icon">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
                    </svg>
                </button>
                <button
                    className="stop-button"
                    onClick={stopListeningHandler}
                    disabled={!isListening}
                >
                    Berhenti
                </button>
                <button
                    className="clear-button"
                    onClick={clearTranscriptHandler}
                    disabled={transcript.length === 0}
                >
                    Clear
                </button>
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="transcript-area">
                <label htmlFor="transcript">Transkrip:</label>
                <textarea
                    id="transcript"
                    value={transcript}
                    rows={8}
                    cols={50}
                    readOnly
                    placeholder={recognitionRef.current ? 'Sila mulakan bercakap...' : 'Pengecaman suara tidak tersedia'}
                />
            </div>
            <div className="image-container">
                {Object.entries(imageUrls).map(([word, url]) => (
                    <div key={word} className="image-wrapper" onClick={() => openImagePopup(url, word)}>
                        <img src={url} alt={word} />
                        <p>{word}</p>
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div className="image-popup">
                    <div className="popup-content">
                        <button className="popup-close-button" onClick={closeImagePopup}>
                            X
                        </button>
                        <h3>{selectedWord}</h3>
                        <img src={selectedImage} alt="Enlarged" />
                        <div className="popup-navigation">
                            <button onClick={goToPreviousImage} disabled={getCurrentImageIndex() <= 0}>
                                Previous
                            </button>
                            <button onClick={goToNextImage} disabled={getCurrentImageIndex() >= getWordList().length - 1}>
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .voice-to-text-container {
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    margin: 20px;
                    background-color: #f9f9f9;
                }

                h2 {
                    margin-top: 0;
                    color: #333;
                }

                .controls {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                button {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s ease;
                }

                .listen-button {
                    background-color: #007bff;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .listen-button:hover {
                    background-color: #0056b3;
                }

                .listen-button.listening {
                    background-color: #28a745;
                }

                .listen-button.listening:hover {
                    background-color: #1e7e34;
                }

                .stop-button {
                    background-color: #dc3545;
                    color: white;
                }

                .stop-button:hover {
                    background-color: #c82333;
                }

                .clear-button {
                    background-color: #6c757d;
                    color: white;
                }

                .clear-button:hover {
                    background-color: #5a6268;
                }

                button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

                .microphone-icon {
                    width: 20px;
                    height: 20px;
                }

                .transcript-area {
                    margin-top: 15px;
                }

                .transcript-area label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #555;
                }

                .transcript-area textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    resize: vertical;
                    color: black;
                }

                .error-message {
                    color: #dc3545;
                    margin-top: 10px;
                    font-weight: bold;
                }

                .image-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 20px;
                }

                .image-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                }

                .image-wrapper img {
                    max-width: 100px;
                    max-height: 100px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }

                .image-wrapper p {
                    margin-top: 5px;
                    font-size: 0.8rem;
                    color: #555;
                    text-align: center;
                }

                .image-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .popup-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                    overflow: auto;
                }

                .popup-close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #333;
                }

                .popup-image {
                    max-width: 100%;
                    max-height: 70vh;
                    display: block;
                    margin: 0 auto;
                }

                .popup-navigation {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 10px;
                }

                .popup-navigation button {
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .popup-navigation button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

                .popup-content h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    color: #333;
                    font-size: 1.2rem;
                    text-align: center;
                }

                .permission-warning {
                    color: #dc3545;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default VoiceToTextMalay;
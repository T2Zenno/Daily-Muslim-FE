import React, { useEffect, useState, useRef } from 'react';

const MECCA_LAT = 21.4225;
const MECCA_LON = 39.8262;

function toRadians(deg: number) {
    return deg * Math.PI / 180;
}

function toDegrees(rad: number) {
    return rad * 180 / Math.PI;
}

// Calculate the bearing from user's location to Mecca
function calculateQiblaBearing(lat: number, lon: number) {
    const latRad = toRadians(lat);
    const lonRad = toRadians(lon);
    const meccaLatRad = toRadians(MECCA_LAT);
    const meccaLonRad = toRadians(MECCA_LON);

    const deltaLon = meccaLonRad - lonRad;
    const x = Math.sin(deltaLon);
    const y = Math.cos(latRad) * Math.tan(meccaLatRad) - Math.sin(latRad) * Math.cos(deltaLon);
    let bearing = Math.atan2(x, y);
    bearing = toDegrees(bearing);
    return (bearing + 360) % 360;
}

export const QiblaDirection: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const compassRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const bearing = calculateQiblaBearing(latitude, longitude);
                setQiblaBearing(bearing);
                setError(null);
            },
            (err) => {
                setQiblaBearing(0); // Default bearing
                setError('Fitur ini hanya didukung pada perangkat dengan sensor gyro seperti Android dan iOS.');
            },
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
        );
    }, []);

    useEffect(() => {
        setPermissionGranted(true);
    }, []);

    useEffect(() => {
        if (!permissionGranted) return;

        function handleOrientation(event: DeviceOrientationEvent) {
            let heading: number | null = null;
            if (event.absolute && event.alpha !== null) {
                // alpha is the compass heading in degrees relative to north
                heading = 360 - event.alpha;
            } else if ((event as any).webkitCompassHeading !== undefined) {
                // iOS non-standard
                heading = (event as any).webkitCompassHeading;
            }
            if (heading !== null) {
                setDeviceHeading(heading);
            }
        }

        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);

        return () => {
            window.removeEventListener('deviceorientationabsolute', handleOrientation);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [permissionGranted]);

    // Calculate needle rotation (shortest path)
    const needleRotation = deviceHeading !== null && qiblaBearing !== null
        ? Math.atan2(Math.sin((qiblaBearing - deviceHeading) * Math.PI / 180), Math.cos((qiblaBearing - deviceHeading) * Math.PI / 180)) * 180 / Math.PI
        : null;

    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4 items-center">
                <h2 className="text-xl font-bold mb-4">🕋 Arah Kiblat</h2>
                {error && <p className="text-red-600 mb-4">{error}</p>}
                {qiblaBearing === null && <p>Memuat arah kiblat...</p>}
                {qiblaBearing !== null && (
                    <>
                        <div
                            ref={compassRef}
                            className={`relative w-64 h-64 rounded-full border-4 ${Math.abs(needleRotation || 0) < 5 ? 'border-green-400 dark:border-green-600' : 'border-gray-400 dark:border-gray-600'} bg-white dark:bg-gray-800 flex items-center justify-center`}
                            style={{ touchAction: 'none' }}
                        >
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-700 dark:text-gray-300 font-semibold">N</div>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-700 dark:text-gray-300 font-semibold">S</div>
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-700 dark:text-gray-300 font-semibold">W</div>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 dark:text-gray-300 font-semibold">E</div>
                            <div
                                className="absolute top-1/2 left-1/2 w-2 h-32 bg-red-600 dark:bg-red-400 origin-center transition-transform duration-100"
                                style={{ transform: `translate(-50%, -50%) rotate(${needleRotation !== null ? needleRotation : 0}deg)`, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                                aria-label="Qibla direction needle"
                            />
                            <div className="w-4 h-4 bg-gray-800 dark:bg-gray-200 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                            {deviceHeading !== null
                                ? `Arah kiblat: ${qiblaBearing.toFixed(1)}° | Arah perangkat: ${deviceHeading.toFixed(1)}°`
                                : `Arah kiblat: ${qiblaBearing.toFixed(1)}° (perangkat tidak mendukung sensor orientasi)`}
                        </p>
                    </>
                )}
            </div>
        </section>
    );
};

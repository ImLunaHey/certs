'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

// For example a: 0, b: 100
// This will produce a random number between 0 and 100
// This includes both the starting and ending numbers
const randomNumberBetween = (a: number, b: number) => {
  return Math.floor(Math.random() * (b - a + 1) + a);
};

const formatNumber = (number: number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function Home() {
  const [certsIssued, setCertsIssued] = useState(0);
  const [domains, setDomains] = useState<{ domain: string; top: number; left: number }[]>([]);
  const { lastMessage } = useWebSocket('wss://certstream.calidog.io', {
    reconnectAttempts: Infinity,
    reconnectInterval: 3000,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    const handleNewDomain = (domain: string) => {
      setCertsIssued((prevCertsIssued) => prevCertsIssued + 1);
      // Only add 1/100th of the domains to the list
      if (randomNumberBetween(1, 100) !== 1) {
        return;
      }
      setDomains((prevDomains) => [
        ...prevDomains,
        {
          domain,
          top: randomNumberBetween(0, 100),
          left: randomNumberBetween(0, 100),
        },
      ]);
    };

    try {
      if (lastMessage !== null) {
        handleNewDomain(JSON.parse(lastMessage.data).data.leaf_cert.all_domains[0]);
      }
    } catch {}
  }, [lastMessage]);

  return (
    <main className="flex h-[100dvh] w-[100dvw] text-white text-sm font-mono bg-black">
      <span className="text-black font-mono text-sm absolute bg-white p-5 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded">
        Certs issued since page load: {formatNumber(certsIssued)}
      </span>
      {domains.map(({ domain, top, left }, index) => {
        return (
          <motion.div
            key={`${domain}-${index}`}
            className="absolute"
            style={{
              top: `${top}dvh`,
              left: `${left}dvw`,
            }}
            initial={{ opacity: 1 }}
            animate={{
              opacity: 0,
            }}
            transition={{ ease: 'linear', duration: 4, delay: 1 }}
            onAnimationComplete={() => {
              setDomains((prevDomains) => prevDomains.filter((d) => d.domain !== domain));
            }}
          >
            {domain}
          </motion.div>
        );
      })}
    </main>
  );
}

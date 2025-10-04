import { useState } from "react";

import { useSocket } from "@/hooks/useSocket";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSiganl] = useState(null);

  useSocket("new_raw_signal", (msg: string) => {
    console.log(msg);
    setSignals((prev) => [...prev, msg.data]);
  });

  return (
    <DefaultLayout>
      <div className="flex h-full w-full gap-2">
        <div className="flex flex-col w-[20rem] h-full px-2 py-1 border-1 border-amber-50 bg-black gap-3 overflow-auto">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="text-white hover:bg-gray-800 p-1"
              onClick={() => setSelectedSiganl(signal)}
            >
              {JSON.stringify(signal, null, 2)}
            </div>
          ))}
        </div>
        <div className=" w-full h-full border-1 border-red-100">
          {!selectedSignal ? (
            <div className="flex h-full w-full justify-center items-center text-2xl text-white font-medium">
              Selecciona una señal cuando aparezcan
            </div>
          ) : (
            <div className="flex flex-col h-full w-full items-center p-4 gap-3">
              <div className="text-2xl text-white">Senal seleccionada</div>
              <div className="flex justify-between w-sm">
                <div className="text-xl text-white">
                  ID: {selectedSignal.externalId}
                </div>
                <div className="text-xl text-white">
                  Valor: {selectedSignal.value}
                </div>
              </div>
              <div className="flex justify-between w-sm">
                <div className="text-xl text-white">
                  Llegada: {selectedSignal.createdAt}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}

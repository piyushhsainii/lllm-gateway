import { ApiKeysProvider } from "@/components/dashboard/ApiKeysProvider";
import { ApiKeysClient } from "@/components/dashboard/ApiKeysClient";

export default function ApiKeysPage() {
    return (
        <ApiKeysProvider>
            <div className="pt-8 px-10 pb-16 max-w-4xl">
                <ApiKeysClient />
            </div>
        </ApiKeysProvider>
    );
}
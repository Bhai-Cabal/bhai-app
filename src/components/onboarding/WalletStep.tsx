// components/onboarding/WalletStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface WalletStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

const BLOCKCHAINS = [
  "Ethereum",
  "Polygon",
  "Solana",
  "Bitcoin",
  "Arbitrum",
  "Optimism",
];
 
export default function WalletStep({ form }: WalletStepProps) {
  const [newBlockchain, setNewBlockchain] = useState('');
  
  const addWallet = () => {
    const currentWallets = form.getValues("walletAddresses");
    form.setValue("walletAddresses", [
      ...currentWallets,
      { blockchain: "", address: "" },
    ]);
  };

  const removeWallet = (index: number) => {
    const currentWallets = form.getValues("walletAddresses");
    form.setValue(
      "walletAddresses",
      currentWallets.filter((_, i) => i !== index)
    );
  };

  const handleBlockchainChange = async (
    index: number,
    selectedValue: string
  ) => {
    form.setValue(`walletAddresses.${index}.blockchain`, selectedValue);

    // If it's a new blockchain, add it to the BLOCKCHAINS array
    if (selectedValue.startsWith("new-")) {
      const newBlockchainName = selectedValue.replace("new-", "");
      BLOCKCHAINS.push(newBlockchainName); 
      setNewBlockchain(''); // Clear the input
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Wallet Addresses</FormLabel>
        <FormDescription>
          Add your blockchain wallet addresses
        </FormDescription>
      </div>

      <div className="space-y-4">
        {form.watch("walletAddresses").map((_, index) => (
          <div key={index} className="flex gap-4 items-start">
            {/* Blockchain Select */}
            <FormField
              control={form.control}
              name={`walletAddresses.${index}.blockchain`}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <Select onValueChange={(value) => handleBlockchainChange(index, value)} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BLOCKCHAINS.map((blockchain) => (
                        <SelectItem key={blockchain} value={blockchain.toLowerCase()}>
                          {blockchain}
                        </SelectItem>
                      ))}

                      {/* Input for adding a new blockchain */}
                      <div className="py-2">
                        <Input
                          placeholder="Add new blockchain"
                          value={newBlockchain}
                          onChange={(e) => setNewBlockchain(e.target.value)}
                          className="text-lg p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      {newBlockchain && (
                        <SelectItem key="new-blockchain" value={`new-${newBlockchain}`}>
                          Add "{newBlockchain}"
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeWallet(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addWallet}>
          Add Wallet Address
        </Button>
      </div>
    </div>
  );
}
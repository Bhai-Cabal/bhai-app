// components/Step5.tsx
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { X } from 'lucide-react';

interface Step5Props {
  BLOCKCHAINS: string[];
  newBlockchain: string;
  setNewBlockchain: React.Dispatch<React.SetStateAction<string>>;
  handleBlockchainChange: (index: number, selectedValue: string) => void;
  removeWallet: (index: number) => void;
  addWallet: () => void;
}

const Step5: React.FC<Step5Props> = ({
  BLOCKCHAINS,
  newBlockchain,
  setNewBlockchain,
  handleBlockchainChange,
  removeWallet,
  addWallet,
}) => {
  const { control, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Wallet Addresses</FormLabel>
        <FormDescription>
          Add your blockchain wallet addresses
        </FormDescription>
      </div>

      <div className="space-y-4">
        {watch('walletAddresses').map((wallet: { blockchain: string; address: string }, index: number) => (
          <div key={index} className="flex gap-4 items-start">
            {/* Blockchain Select */}
            <Controller
              name={`walletAddresses.${index}.blockchain`}
              control={control}
              render={({ field }: { field: { value: string } }) => (
                <FormItem className="w-[200px]">
                  <FormControl>
                    <Select
                      onValueChange={(value: string) => handleBlockchainChange(index, value)}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOCKCHAINS.map((blockchain: string) => (
                          <SelectItem key={blockchain} value={blockchain.toLowerCase()}>
                            {blockchain}
                          </SelectItem>
                        ))}
                        {/* Input for adding a new blockchain */}
                        <div className="py-2">
                          <Input
                            placeholder="Add new blockchain"
                            value={newBlockchain}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBlockchain(e.target.value)}
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
                  </FormControl>
                  <FormMessage>{(errors.walletAddresses as any)?.[index]?.blockchain?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              name={`walletAddresses.${index}.address`}
              control={control}
              render={({ field }: { field: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void } }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Enter your wallet address"
                      {...field}
                      className="text-lg p-3"
                    />
                  </FormControl>
                  <FormMessage>{(errors.walletAddresses as any)?.[index]?.address?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeWallet(index)}>
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
};

export default Step5;

import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

interface Company {
  id: string;
  name: string;
  website: string;
  // description?: string; // Removed property
}

interface Step3Props {
  addCompany: () => void;
  removeCompany: (index: number) => void;
}

const websiteSchema = z.string().url('Invalid URL');

const Step3: React.FC<Step3Props> = ({ addCompany, removeCompany }) => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fetch companies from Supabase on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from('companies').select('*');

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data);
        setFilteredCompanies(data);
      }
    };

    fetchCompanies();
  }, []);

  // Handle adding a new company to the database
  const handleAddNewCompany = async () => {
    // Validate website URL
    const websiteValidation = websiteSchema.safeParse(newCompanyWebsite);
    if (!websiteValidation.success) {
      setAlert({ type: 'error', message: websiteValidation.error.errors[0].message });
      return;
    }

    // Check if the company already exists in the database
    const existingCompany = companies.find(company => company.name === newCompanyName && company.website === newCompanyWebsite);
    if (existingCompany) {
      setAlert({ type: 'error', message: 'Company with this name and website already exists.' });
      return;
    }

    // If the company does not exist, add it to the database
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name: newCompanyName, website: newCompanyWebsite }])
      .select();

    if (error) {
      console.error('Error adding company:', error);
      setAlert({ type: 'error', message: 'Error adding company.' });
    } else if (data && data[0]) {
      const newCompany = data[0];

      // Update both companies and filtered companies lists
      setCompanies(prevCompanies => [...prevCompanies, newCompany]);
      setFilteredCompanies(prevFiltered => [...prevFiltered, newCompany]);

      // Update form data if we have a current index
      if (currentIndex !== null) {
        setValue(`companies.${currentIndex}.companyId`, newCompany.id);
        setValue(`companies.${currentIndex}.name`, newCompany.name);
        setValue(`companies.${currentIndex}.website`, newCompany.website);
      }

      setAlert({ type: 'success', message: 'Company added successfully.' });
    }

    // Reset dialog state
    setIsNewCompanyDialogOpen(false);
    setNewCompanyName('');
    setNewCompanyWebsite('');
    setCurrentIndex(null);
    setSearchQuery('');
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCompanies(filtered);
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{alert.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
      <div>
        <FormLabel>Work Experience</FormLabel>
        <FormDescription>
          Add your current and previous work experience
        </FormDescription>
      </div>

      <div className="space-y-8">
        {watch('companies').map((company: any, index: number) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => removeCompany(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <Controller
              name={`companies.${index}.companyId`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'new') {
                          setCurrentIndex(index);
                          setIsNewCompanyDialogOpen(true);
                        } else {
                          const selectedCompany = companies.find((c) => c.id === value);
                          if (selectedCompany) {
                            setValue(`companies.${index}.name`, selectedCompany.name);
                            setValue(`companies.${index}.website`, selectedCompany.website);
                          }
                        }
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search company"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                          />
                        </div>
                        {filteredCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">Add New Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>{(errors.companies as any)?.[index]?.companyId?.message}</FormMessage>
                </FormItem>
              )}
            />

            {watch(`companies.${index}.companyId`) === 'new' && (
              <>
                <Controller
                  name={`companies.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-lg p-6" />
                      </FormControl>
                      <FormMessage>{(errors.companies as any)?.[index]?.name?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <Controller
                  name={`companies.${index}.website`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} className="text-lg p-6" />
                      </FormControl>
                      <FormMessage>{(errors.companies as any)?.[index]?.website?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Removed description field */}
              </>
            )}

            <Controller
              name={`companies.${index}.role`}
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-lg p-6" />
                  </FormControl>
                  <FormMessage>{(errors.companies as any)?.[index]?.role?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name={`companies.${index}.startDate`}
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="text-lg p-6" />
                    </FormControl>
                    <FormMessage>{(errors.companies as any)?.[index]?.startDate?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {!watch(`companies.${index}.isCurrent`) && (
                <Controller
                  name={`companies.${index}.endDate`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="text-lg p-6" />
                      </FormControl>
                      <FormMessage>{(errors.companies as any)?.[index]?.endDate?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Controller
              name={`companies.${index}.isCurrent`}
              control={control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I currently work here</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addCompany}>
          Add Company
        </Button>
      </div>

      {/* New Company Dialog */}
      <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
            <Input
              placeholder="Company Website"
              value={newCompanyWebsite}
              onChange={(e) => setNewCompanyWebsite(e.target.value)}
            />
            {/* Removed description input */}
            <Button type="button" onClick={handleAddNewCompany}>
              Add Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step3;
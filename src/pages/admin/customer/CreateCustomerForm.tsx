import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { CreateCustomerModal } from "./CreateCustomerModal";

type CreateCustomerFormProps = {
  franchiseId: string;
  onSuccess?: () => void;
};

export function CreateCustomerForm({
  franchiseId,
  onSuccess,
}: CreateCustomerFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="default"
          size="default"
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => setIsOpen(true)}
        >
          Create Account
        </Button>
      </div>

      <CreateCustomerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        franchiseId={franchiseId}
        onSuccess={() => {
          onSuccess?.();
        }}
      />
    </>
  );
}


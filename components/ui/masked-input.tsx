import React from "react";

type MaskedInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  mask: 'cpfCnpj' | 'phone' | 'cep' | 'cardNumber' | 'expiry' | 'cvv';
};

function applyMask(value: string, mask: MaskedInputProps['mask']) {
  switch (mask) {
    case 'cpfCnpj': {
      // Remove non-digits
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        // CPF: 000.000.000-00
        return value
          .replace(/^(\d{3})(\d)/, '$1.$2')
          .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
      } else {
        // CNPJ: 00.000.000/0000-00
        return value
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
          .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
      }
    }
    case 'phone': {
      value = value.replace(/\D/g, '');
      if (value.length <= 10) {
        // (00) 0000-0000
        return value
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        // (00) 00000-0000
        return value
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }
    case 'cep': {
      value = value.replace(/\D/g, '');
      return value.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
    }
    case 'cardNumber': {
      value = value.replace(/\D/g, '').slice(0, 19);
      return value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    case 'expiry': {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length > 2) {
        return value.replace(/^(\d{2})(\d{1,2})/, '$1/$2');
      }
      return value;
    }
    case 'cvv': {
      return value.replace(/\D/g, '').slice(0, 4);
    }
    default:
      return value;
  }
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onChange, ...props }, ref) => {
    const [val, setVal] = React.useState(props.value?.toString() ?? '');

    React.useEffect(() => {
      if (props.value !== undefined) {
        setVal(props.value.toString());
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const masked = applyMask(raw, mask);
      setVal(masked);
      if (onChange) {
        // Create a synthetic event with masked value
        const event = {
          ...e,
          target: {
            ...e.target,
            value: masked,
          },
        };
        onChange(event as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <input
        className="bg-muted border w-full h-9 rounded-md"
        {...props}
        ref={ref}
        value={val}
        onChange={handleChange}
        autoComplete="off"
      />
    );
  }
);
MaskedInput.displayName = "MaskedInput";
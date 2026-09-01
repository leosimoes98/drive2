import { ProfileSetup } from "@/components/ProfileSetup";
import { ProfileRole } from "@/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createProfileMock = vi.fn();

vi.mock("@/hooks/useQueries", () => ({
  useCreateProfile: () => ({
    mutate: createProfileMock,
    isPending: false,
  }),
}));

describe("ProfileSetup", () => {
  beforeEach(() => {
    createProfileMock.mockReset();
  });

  it("creates a customer profile without vehicle fields", async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);

    await user.type(screen.getByLabelText("Nome"), "Ana Souza");

    // Customer is the default role, so no vehicle fields are shown.
    expect(screen.queryByLabelText("Marca")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("profile_submit_button"));

    expect(createProfileMock).toHaveBeenCalledTimes(1);
    const [input] = createProfileMock.mock.calls[0];
    expect(input.role).toBe(ProfileRole.customer);
    expect(input.name).toBe("Ana Souza");
    expect(input.vehicle).toBeNull();
  });

  it("requires vehicle details when creating a driver profile", async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);

    await user.click(screen.getByTestId("role_driver"));

    // Vehicle fields appear once driver is selected.
    expect(screen.getByLabelText("Marca")).toBeInTheDocument();

    // Submit is disabled until the vehicle is complete.
    await user.type(screen.getByLabelText("Nome"), "Carlos Lima");
    expect(screen.getByTestId("profile_submit_button")).toBeDisabled();

    await user.type(screen.getByLabelText("Marca"), "Toyota");
    await user.type(screen.getByLabelText("Modelo"), "Corolla");
    await user.type(screen.getByLabelText("Placa"), "abc-1234");
    await user.type(screen.getByLabelText("Cor"), "Prata");
    await user.type(screen.getByLabelText("Ano"), "2020");

    await user.click(screen.getByTestId("profile_submit_button"));

    expect(createProfileMock).toHaveBeenCalledTimes(1);
    const [input] = createProfileMock.mock.calls[0];
    expect(input.role).toBe(ProfileRole.driver);
    expect(input.vehicle).toEqual({
      brand: "Toyota",
      model: "Corolla",
      plate: "ABC-1234", // uppercased on submit
      color: "Prata",
      year: 2020n,
    });
  });

  it("does not submit when the name is empty", () => {
    render(<ProfileSetup />);
    expect(screen.getByTestId("profile_submit_button")).toBeDisabled();
    fireEvent.click(screen.getByTestId("profile_submit_button"));
    expect(createProfileMock).not.toHaveBeenCalled();
  });
});

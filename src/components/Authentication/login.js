import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { setUser } = ChatState();

  const doLogin = async (emailValue, passwordValue) => {
    if (!emailValue || !passwordValue) {
      toast({
        title: "Please fill all fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ clear old session first (prevents “last user” sticking around)
      localStorage.removeItem("userInfo");

      const config = {
        headers: { "Content-Type": "application/json" },
      };

      const { data } = await axios.post(
        "/api/user/login",
        { email: emailValue.trim(), password: passwordValue },
        config
      );

      // ✅ overwrite localStorage with THIS user
      localStorage.setItem("userInfo", JSON.stringify(data));

      // ✅ update context immediately
      setUser(data);

      toast({
        title: "Login successful",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });

      navigate("/chats");
    } catch (err) {
      toast({
        title: "Login failed",
        description:
          err?.response?.data?.message || err.message || "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = () => doLogin(email, password);

  // ✅ optional: instant guest login (common in tutorials)
  const guestHandler = () => {
    const guestEmail = "guest@example.com";
    const guestPass = "123456";
    setEmail(guestEmail);
    setPassword(guestPass);
    doLogin(guestEmail, guestPass);
  };

  return (
    <VStack spacing="10px">
      <FormControl isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Your Email"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Enter Your Password"
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={() => setShow(!show)}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="blue"
        width="100%"
        style={{ marginTop: 15 }}
        onClick={submitHandler}
        isLoading={loading}
      >
        Login
      </Button>

      <Button
        variant="solid"
        colorScheme="red"
        width="100%"
        onClick={guestHandler}
        isLoading={loading}
      >
        Get Guest User Credentials
      </Button>
    </VStack>
  );
}

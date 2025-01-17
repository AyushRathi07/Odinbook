import axios from "axios";
import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import AuthContext from "../../context/auth-context";
import { Button } from "reactstrap";
import Facebook from "react-facebook-login/dist/facebook-login-render-props";
function FacebookLogin() {
  const { getLoggedIn } = useContext(AuthContext);

  const history = useHistory();

  async function fbLogin(data) {
    await axios.post("http://localhost:5000/auth/facebook", {
      access_token: data,
    });
    console.log(data);
    await getLoggedIn();
    history.push("/");
  }

  async function responseFacebook(res) {
    await fbLogin(res.accessToken);
    console.log(res);
  }

  return (
    <Facebook
      appId="1121590768282051"
      render={(renderProps) => (
        <Button
          style={{ marginRight: 15 }}
          outline
          color="info"
          block
          onClick={renderProps.onClick}
        >
          Login with Facebook
        </Button>
      )}
      fields="name,email,givenName,familyName"
      callback={responseFacebook}
    />
  );
}

export default FacebookLogin;
